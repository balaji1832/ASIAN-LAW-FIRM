<?php

declare(strict_types=1);

session_start();

require_once __DIR__ . '/db.php';

$token = trim(
    (string) ($_GET['token'] ?? '')
);

if (
    $token === '' ||
    !isset($_SESSION['pdf_download_tokens'][$token])
) {
    http_response_code(404);
    exit('Invalid or expired download link.');
}

$downloadData =
    $_SESSION['pdf_download_tokens'][$token];

/*
|--------------------------------------------------------------------------
| One-time token
|--------------------------------------------------------------------------
*/

unset(
    $_SESSION['pdf_download_tokens'][$token]
);

$expiresAt = (int) (
    $downloadData['expires_at'] ?? 0
);

if ($expiresAt < time()) {
    http_response_code(410);
    exit('This download link has expired.');
}

$filePath = (string) (
    $downloadData['path'] ?? ''
);

$fileName = (string) (
    $downloadData['filename'] ??
    'asian-law-firm-guide.pdf'
);

$leadId = (int) (
    $downloadData['lead_id'] ?? 0
);

if (
    $filePath === '' ||
    !is_file($filePath)
) {
    http_response_code(404);
    exit('PDF file not found.');
}

/*
|--------------------------------------------------------------------------
| Mark as downloaded
|--------------------------------------------------------------------------
*/

if ($leadId > 0) {
    try {
        $statement = $pdo->prepare(
            'UPDATE pdf_download_leads
             SET downloaded_at = NOW()
             WHERE id = :id'
        );

        $statement->execute([
            ':id' => $leadId,
        ]);
    } catch (Throwable $exception) {
        error_log(
            'Unable to update PDF download status: ' .
            $exception->getMessage()
        );
    }
}

/*
|--------------------------------------------------------------------------
| Serve PDF
|--------------------------------------------------------------------------
*/

while (ob_get_level() > 0) {
    ob_end_clean();
}

header('Content-Type: application/pdf');
header(
    'Content-Disposition: attachment; filename="' .
    basename($fileName) .
    '"'
);
header('Content-Length: ' . filesize($filePath));
header('Cache-Control: private, no-store, no-cache');
header('Pragma: no-cache');
header('X-Content-Type-Options: nosniff');

readfile($filePath);

exit;