<?php

declare(strict_types=1);

// Front controller. Production: httpdocs/api/index.php; the application lives outside the web root.

$candidates = [
    __DIR__ . '/../../primed-app/bootstrap.php', // production layout
    __DIR__ . '/../bootstrap.php',               // repository / DDEV layout
];

try {
    $bootstrap = null;
    foreach ($candidates as $candidate) {
        if (is_file($candidate)) {
            $bootstrap = $candidate;
            break;
        }
    }
    if ($bootstrap === null) {
        throw new RuntimeException('Application bootstrap not found');
    }

    $kernel = require $bootstrap;
    if (!$kernel instanceof Primed\Kernel) {
        throw new RuntimeException('Invalid bootstrap result');
    }
    $kernel->run();
} catch (Throwable $e) {
    // Bootstrap failed (e.g. missing .env). Log the type only and answer without details.
    error_log('Primed bootstrap failure: ' . $e::class);
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    echo '{"error":{"code":"internal_error","message":"Es ist ein Fehler aufgetreten."}}';
}
