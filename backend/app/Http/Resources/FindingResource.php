<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class FindingResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'description' => $this->description,
            'evidence' => $this->evidence,
            'severity' => $this->severity,
            'detected_at' => $this->detected_at?->toISOString(),
            'rule' => new DetectionRuleResource($this->whenLoaded('rule')),
            'assessment' => $this->whenLoaded('assessment', function () {
                return [
                    'id' => $this->assessment->id,
                    'assessment_code' => $this->assessment->assessment_code,
                    'employee' => $this->assessment->employee_name ? [
                        'name' => $this->assessment->employee_name,
                        'department' => $this->assessment->employee_department,
                    ] : null,
                ];
            }),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
