<?php

declare(strict_types=1);

session_start();

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

require_once __DIR__ . '/db.php';

date_default_timezone_set('Asia/Kolkata');

const GOOGLE_SHEET_URL =
    'https://script.google.com/macros/s/AKfycbyIKCorQkZUKvHTyLc4QBsb985YYK4L51XU-kIRfXb6g8VEbBKxPCeKSy6ETtYVpCvf/exec';

const PDF_DISPLAY_NAME =
    'Asian Law Firm Property Documentation Guide';

const PDF_FILE_NAME =
    'asian-law-firm-property-guide.pdf';

/*
|--------------------------------------------------------------------------
| PDF location
|--------------------------------------------------------------------------
| Upload your PDF inside:
| assets/pdf/asian-law-firm-property-guide.pdf
*/

const PDF_RELATIVE_PATH =
    '/pdf/asian-law-firm-property-guide.pdf';

function respond(
    bool $success,
    string $message,
    int $statusCode = 200,
    array $extra = []
): never {
    http_response_code($statusCode);

    echo json_encode(
        array_merge(
            [
                'success' => $success,
                'message' => $message,
            ],
            $extra
        ),
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
    );

    exit;
}

function cleanInput(string $value): string
{
    $value = trim($value);

    return preg_replace('/\s+/', ' ', $value) ?? $value;
}

function sendPdfLeadToGoogleSheet(array $data): bool
{
    if (!function_exists('curl_init')) {
        error_log('Google Sheets sync failed: cURL is not enabled.');

        return false;
    }

    $postFields = http_build_query(
        [
            'form_type' => 'pdf_download',
            'id' => (string) ($data['id'] ?? ''),
            'name' => (string) ($data['name'] ?? ''),
            'email' => (string) ($data['email'] ?? ''),
            'phone' => (string) ($data['phone'] ?? ''),
            'pdf_name' => (string) ($data['pdf_name'] ?? ''),
            'created_at' => (string) ($data['created_at'] ?? ''),
        ],
        '',
        '&',
        PHP_QUERY_RFC3986
    );

    $curl = curl_init(GOOGLE_SHEET_URL);

    curl_setopt_array($curl, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $postFields,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/x-www-form-urlencoded; charset=UTF-8',
            'Accept: application/json',
        ],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_MAXREDIRS => 5,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
        CURLOPT_USERAGENT => 'AsianLawFirmPdfDownload/1.0',
    ]);

    $response = curl_exec($curl);
    $curlError = curl_error($curl);

    $httpCode = (int) curl_getinfo(
        $curl,
        CURLINFO_HTTP_CODE
    );

    curl_close($curl);

    if ($response === false) {
        error_log(
            'Google Sheets cURL error: ' . $curlError
        );

        return false;
    }

    if ($httpCode < 200 || $httpCode >= 300) {
        error_log(
            'Google Sheets HTTP error: ' .
            $httpCode .
            ' Response: ' .
            $response
        );

        return false;
    }

    $result = json_decode(trim($response), true);

    if (
        !is_array($result) ||
        ($result['success'] ?? false) !== true
    ) {
        error_log(
            'Google Sheets invalid response: ' . $response
        );

        return false;
    }

    return true;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(false, 'Invalid request method.', 405);
}

/*
|--------------------------------------------------------------------------
| Honeypot spam protection
|--------------------------------------------------------------------------
*/

$website = trim(
    (string) ($_POST['website'] ?? '')
);

if ($website !== '') {
    respond(
        true,
        'Your download is ready.',
        200,
        [
            'download_url' => '#',
        ]
    );
}

/*
|--------------------------------------------------------------------------
| Check PDF file
|--------------------------------------------------------------------------
*/

$pdfAbsolutePath =
    __DIR__ . DIRECTORY_SEPARATOR . PDF_RELATIVE_PATH;

if (!is_file($pdfAbsolutePath)) {
    error_log(
        'PDF file was not found: ' . $pdfAbsolutePath
    );

    respond(
        false,
        'The PDF file is currently unavailable.',
        500
    );
}

/*
|--------------------------------------------------------------------------
| Form fields
|--------------------------------------------------------------------------
*/

$name = cleanInput(
    (string) ($_POST['name'] ?? '')
);

$email = strtolower(
    cleanInput(
        (string) ($_POST['email'] ?? '')
    )
);

$phone = cleanInput(
    (string) ($_POST['phone'] ?? '')
);

$pdfName = cleanInput(
    (string) ($_POST['pdf_name'] ?? PDF_DISPLAY_NAME)
);

$errors = [];

/*
|--------------------------------------------------------------------------
| Validation
|--------------------------------------------------------------------------
*/

if ($name === '') {
    $errors['name'] = 'Please enter your name.';
} elseif (
    mb_strlen($name) < 2 ||
    mb_strlen($name) > 150
) {
    $errors['name'] =
        'Name must contain between 2 and 150 characters.';
}

if ($email === '') {
    $errors['email'] =
        'Please enter your email address.';
} elseif (
    !filter_var($email, FILTER_VALIDATE_EMAIL)
) {
    $errors['email'] =
        'Please enter a valid email address.';
}

if ($phone === '') {
    $errors['phone'] =
        'Please enter your phone number.';
} elseif (
    !preg_match('/^[0-9+\-\s()]{7,20}$/', $phone)
) {
    $errors['phone'] =
        'Please enter a valid phone number.';
}

if ($errors !== []) {
    respond(
        false,
        'Please correct the highlighted fields.',
        422,
        [
            'errors' => $errors,
        ]
    );
}

/*
|--------------------------------------------------------------------------
| Save lead
|--------------------------------------------------------------------------
*/

try {
    $statement = $pdo->prepare(
        'INSERT INTO pdf_download_leads
            (
                name,
                email,
                phone,
                pdf_name,
                sheet_synced
            )
         VALUES
            (
                :name,
                :email,
                :phone,
                :pdf_name,
                0
            )'
    );

    $statement->execute([
        ':name' => $name,
        ':email' => $email,
        ':phone' => $phone,
        ':pdf_name' => $pdfName,
    ]);

    $leadId = (int) $pdo->lastInsertId();

    /*
    |--------------------------------------------------------------------------
    | Google Sheets sync
    |--------------------------------------------------------------------------
    */

    $sheetSynced = sendPdfLeadToGoogleSheet([
        'id' => $leadId,
        'name' => $name,
        'email' => $email,
        'phone' => $phone,
        'pdf_name' => $pdfName,
        'created_at' => date('Y-m-d H:i:s'),
    ]);

    if ($sheetSynced) {
        $updateStatement = $pdo->prepare(
            'UPDATE pdf_download_leads
             SET sheet_synced = 1
             WHERE id = :id'
        );

        $updateStatement->execute([
            ':id' => $leadId,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Generate one-time download token
    |--------------------------------------------------------------------------
    */

    $downloadToken = bin2hex(
        random_bytes(32)
    );

    $_SESSION['pdf_download_tokens'] ??= [];

    $_SESSION['pdf_download_tokens'][$downloadToken] = [
        'lead_id' => $leadId,
        'path' => $pdfAbsolutePath,
        'filename' => PDF_FILE_NAME,
        'expires_at' => time() + 300,
    ];

    respond(
        true,
        'Your PDF is ready to download.',
        200,
        [
            'sheet_synced' => $sheetSynced,
            'download_url' =>
                'download-pdf.php?token=' .
                urlencode($downloadToken),
        ]
    );
} catch (Throwable $exception) {
    error_log(
        'PDF lead submission error: ' .
        $exception->getMessage()
    );

    respond(
        false,
        'Unable to process your download. Please try again.',
        500
    );
}