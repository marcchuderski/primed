<?php

declare(strict_types=1);

namespace Primed\Controller;

use Primed\Container;
use Primed\Http\Input;
use Primed\Http\Request;
use Primed\Http\Response;

final class SettingsController
{
    public function __construct(private readonly Container $c)
    {
    }

    /**
     * @param array<string, string> $params
     */
    public function show(Request $request, array $params): Response
    {
        $user = $this->c->authenticator()->require($request)->user;

        return Response::json(['settings' => $this->c->settings()->get($user->id)->toPublic()]);
    }

    /**
     * @param array<string, string> $params
     */
    public function update(Request $request, array $params): Response
    {
        $user = $this->c->authenticator()->require($request)->user;
        $input = Input::fromRequest($request);

        if ($input->has('theme')) {
            $theme = $input->enum('theme', ['system', 'light', 'dark'], 'Darstellung');
            $this->c->settings()->updateTheme($user->id, $theme, $this->c->clock->now());
        }
        if ($input->has('proteinDefault')) {
            $protein = $input->int('proteinDefault', 20, 400, 'Protein-Standard');
            $this->c->days()->updateProteinDefault($user->id, $protein);
        }

        return Response::json(['settings' => $this->c->settings()->get($user->id)->toPublic()]);
    }
}
