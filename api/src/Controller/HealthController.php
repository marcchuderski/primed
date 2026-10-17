<?php

declare(strict_types=1);

namespace Primed\Controller;

use Primed\Http\Request;
use Primed\Http\Response;

final class HealthController
{
    /**
     * @param array<string, string> $params
     */
    public function show(Request $request, array $params): Response
    {
        return Response::json(['status' => 'ok']);
    }
}
