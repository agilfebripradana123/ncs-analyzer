<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class AssessmentResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'status' => $this->status,
            'started_at' => $this->started_at?->toISOString(),
            'completed_at' => $this->completed_at?->toISOString(),
            'employee' => new EmployeeResource($this->whenLoaded('employee')),
            'assessor' => new UserResource($this->whenLoaded('assessor')),
            'consent' => new ConsentResource($this->whenLoaded('consent')),
            'session' => new SessionResource($this->whenLoaded('session')),
            'risk_score' => new RiskScoreResource($this->whenLoaded('riskScore')),
            'report' => new ReportResource($this->whenLoaded('report')),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
