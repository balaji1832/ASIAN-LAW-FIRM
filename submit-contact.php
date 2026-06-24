<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

require_once __DIR__ . '/db.php';

/*
|--------------------------------------------------------------------------
| Timezone
|--------------------------------------------------------------------------
*/

date_default_timezone_set('Asia/Kolkata');

/*
|--------------------------------------------------------------------------
| Google Apps Script URL
|--------------------------------------------------------------------------
*/

const GOOGLE_SHEET_URL =
    'https://script.google.com/macros/s/AKfycbyIKCorQkZUKvHTyLc4QBsb985YYK4L51XU-kIRfXb6g8VEbBKxPCeKSy6ETtYVpCvf/exec';

/*
|--------------------------------------------------------------------------
| JSON response helper
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| Clean text input
|--------------------------------------------------------------------------
*/

function cleanInput(string $value): string
{
    $value = trim($value);

    return preg_replace('/\s+/', ' ', $value) ?? $value;
}

/*
|--------------------------------------------------------------------------
| Send enquiry to Google Sheets
|--------------------------------------------------------------------------
*/

function sendToGoogleSheet(array $data): bool
{
    if (!function_exists('curl_init')) {
        error_log('Google Sheet sync failed: PHP cURL is not enabled.');

        return false;
    }

    /*
    |--------------------------------------------------------------------------
    | Apps Script uses e.parameter, so send URL-encoded form fields.
    |--------------------------------------------------------------------------
    */

    $postFields = http_build_query(
        [
            'id'         => (string) ($data['id'] ?? ''),
            'name'       => (string) ($data['name'] ?? ''),
            'phone'      => (string) ($data['phone'] ?? ''),
            'email'      => (string) ($data['email'] ?? ''),
            'message'    => (string) ($data['message'] ?? ''),
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

        CURLOPT_USERAGENT => 'AsianLawFirmContactForm/1.0',
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
            'Google Sheet cURL error: ' . $curlError
        );

        return false;
    }

    if ($httpCode < 200 || $httpCode >= 300) {
        error_log(
            sprintf(
                'Google Sheet HTTP error %d. Response: %s',
                $httpCode,
                $response
            )
        );

        return false;
    }

    $decodedResponse = json_decode(
        trim($response),
        true
    );

    if (!is_array($decodedResponse)) {
        error_log(
            'Google Sheet returned invalid JSON: ' .
            $response
        );

        return false;
    }

    if (($decodedResponse['success'] ?? false) !== true) {
        error_log(
            'Google Sheet rejected the request: ' .
            $response
        );

        return false;
    }

    return true;
}

/*
|--------------------------------------------------------------------------
| Accept only POST requests
|--------------------------------------------------------------------------
*/

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(
        false,
        'Invalid request method.',
        405
    );
}

/*
|--------------------------------------------------------------------------
| Honeypot spam protection
|--------------------------------------------------------------------------
*/

$honeypot = trim(
    (string) ($_POST['website'] ?? '')
);

if ($honeypot !== '') {
    respond(
        true,
        'Thank you. Your message has been submitted.'
    );
}

/*
|--------------------------------------------------------------------------
| Receive form data
|--------------------------------------------------------------------------
*/

$name = cleanInput(
    (string) ($_POST['name'] ?? '')
);

$phone = cleanInput(
    (string) ($_POST['phone'] ?? '')
);

$email = strtolower(
    cleanInput(
        (string) ($_POST['email'] ?? '')
    )
);

$message = trim(
    (string) ($_POST['message'] ?? '')
);

$errors = [];

/*
|--------------------------------------------------------------------------
| Validate name
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

/*
|--------------------------------------------------------------------------
| Validate phone
|--------------------------------------------------------------------------
*/

if ($phone === '') {
    $errors['phone'] =
        'Please enter your phone number.';
} elseif (
    !preg_match(
        '/^[0-9+\-\s()]{7,20}$/',
        $phone
    )
) {
    $errors['phone'] =
        'Please enter a valid phone number.';
}

/*
|--------------------------------------------------------------------------
| Validate email
|--------------------------------------------------------------------------
*/

if ($email === '') {
    $errors['email'] =
        'Please enter your email address.';
} elseif (
    !filter_var(
        $email,
        FILTER_VALIDATE_EMAIL
    )
) {
    $errors['email'] =
        'Please enter a valid email address.';
}

/*
|--------------------------------------------------------------------------
| Validate message
|--------------------------------------------------------------------------
*/

if ($message === '') {
    $errors['message'] =
        'Please enter your message.';
} elseif (mb_strlen($message) < 5) {
    $errors['message'] =
        'Message must contain at least 5 characters.';
} elseif (mb_strlen($message) > 3000) {
    $errors['message'] =
        'Message must not exceed 3000 characters.';
}

/*
|--------------------------------------------------------------------------
| Return validation errors
|--------------------------------------------------------------------------
*/

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
| Store in MySQL and Google Sheets
|--------------------------------------------------------------------------
*/

try {
    /*
    |--------------------------------------------------------------------------
    | Insert enquiry into MySQL
    |--------------------------------------------------------------------------
    */

    $statement = $pdo->prepare(
        'INSERT INTO contact_enquiries
            (
                name,
                phone,
                email,
                message,
                sheet_synced
            )
         VALUES
            (
                :name,
                :phone,
                :email,
                :message,
                0
            )'
    );

    $statement->execute([
        ':name' => $name,
        ':phone' => $phone,
        ':email' => $email,
        ':message' => $message,
    ]);

    $enquiryId = (int) $pdo->lastInsertId();

    /*
    |--------------------------------------------------------------------------
    | Send the same enquiry to Google Sheets
    |--------------------------------------------------------------------------
    */

    $sheetSynced = sendToGoogleSheet([
        'id' => $enquiryId,
        'name' => $name,
        'phone' => $phone,
        'email' => $email,
        'message' => $message,
        'created_at' => date('Y-m-d H:i:s'),
    ]);

    /*
    |--------------------------------------------------------------------------
    | Update sync status when Google Sheets succeeds
    |--------------------------------------------------------------------------
    */

    if ($sheetSynced) {
        $updateStatement = $pdo->prepare(
            'UPDATE contact_enquiries
             SET sheet_synced = 1
             WHERE id = :id'
        );

        $updateStatement->execute([
            ':id' => $enquiryId,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Return success response
    |--------------------------------------------------------------------------
    */

    respond(
        true,
        $sheetSynced
            ? 'Thank you! Your message has been submitted successfully.'
            : 'Your message was saved successfully. Google Sheet synchronization is pending.',
        200,
        [
            'enquiry_id' => $enquiryId,
            'sheet_synced' => $sheetSynced,
        ]
    );
} catch (Throwable $exception) {
    error_log(
        'Contact form submission error: ' .
        $exception->getMessage()
    );

    respond(
        false,
        'Unable to submit your message right now. Please try again.',
        500
    );
}