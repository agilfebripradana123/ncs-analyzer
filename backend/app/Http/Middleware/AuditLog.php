<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuditLog
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if ($request->user() && in_array($request->method(), ['POST', 'PUT', 'PATCH', 'DELETE'])) {
            $this->log($request, $response);
        }

        return $response;
    }

    protected function log(Request $request, Response $response): void
    {
        if ($response->getStatusCode() >= 400) {
            return;
        }

        $action = $this->inferAction($request);
        $description = $this->inferDescription($request, $action);
        [$entityType, $entityId] = $this->inferEntity($request);

        \App\Models\AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => $action,
            'description' => $description,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'ip_address' => $request->ip(),
        ]);
    }

    protected function inferAction(Request $request): string
    {
        return match ($request->method()) {
            'POST' => 'create',
            'PUT', 'PATCH' => 'update',
            'DELETE' => 'delete',
            default => 'unknown',
        };
    }

    protected function inferDescription(Request $request, string $action): string
    {
        $path = $request->path();
        $segments = explode('/', $path);
        $resource = $segments[count($segments) - (in_array($action, ['update', 'delete']) ? 2 : 1)] ?? 'resource';

        return ucfirst($action) . ' ' . str_replace('-', ' ', $resource);
    }

    protected function inferEntity(Request $request): array
    {
        $segments = explode('/', $request->path());
        
        foreach ($segments as $i => $segment) {
            if (is_numeric($segment) && isset($segments[$i - 1])) {
                $type = ucfirst(rtrim($segments[$i - 1], 's'));
                return [$type, (int)$segment];
            }
        }

        return [null, null];
    }
}
