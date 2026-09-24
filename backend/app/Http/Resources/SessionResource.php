<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class SessionResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'session_token' => $this->session_token,
            'consent_token' => $this->consent_token,
            'status' => $this->status,
            'started_at' => $this->started_at?->toISOString(),
            'expires_at' => $this->expires_at?->toISOString(),
            'ended_at' => $this->ended_at?->toISOString(),
            'consent_given_at' => $this->consent_given_at?->toISOString(),
            'agent_status' => $this->agent_status,
            'device_id' => $this->device_id,
            'connected_at' => $this->connected_at?->toISOString(),
            'last_seen_at' => $this->last_seen_at?->toISOString(),
            'assessment_id' => $this->assessment_id,
            'assessment' => $this->whenLoaded('assessment', function () {
                return [
                    'id' => $this->assessment->id,
                    'assessment_code' => $this->assessment->assessment_code,
                    'status' => $this->assessment->status,
                    'employee' => $this->assessment->employee ? [
                        'id' => $this->assessment->employee->id,
                        'name' => $this->assessment->employee->name,
                        'employee_code' => $this->assessment->employee->employee_code,
                    ] : null,
                ];
            }),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
