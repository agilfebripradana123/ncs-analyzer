<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class AssessmentResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'assessment_code' => $this->assessment_code,
            'title' => $this->title,
            'status' => $this->status,
            'description' => $this->description,
            'started_at' => $this->started_at?->toISOString(),
            'completed_at' => $this->completed_at?->toISOString(),
            'employee' => $this->employee_name ? [
                'name' => $this->employee_name,
                'department' => $this->employee_department,
            ] : null,
            'assessor' => new UserResource($this->whenLoaded('assessor')),
            'consent' => new ConsentResource($this->whenLoaded('consent')),
            'session' => new SessionResource($this->whenLoaded('session')),
            'risk_score' => new RiskScoreResource($this->whenLoaded('riskScore')),
            'report' => new ReportResource($this->whenLoaded('report')),
            'total_findings' => ($this->visual_findings_count ?? 0) + ($this->log_findings_count ?? 0),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
