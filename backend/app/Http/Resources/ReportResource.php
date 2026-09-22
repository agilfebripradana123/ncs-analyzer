<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ReportResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'summary' => $this->summary,
            'total_findings' => $this->total_findings,
            'generated_at' => $this->generated_at?->toISOString(),
            'assessment_id' => $this->assessment_id,
            'assessment' => $this->whenLoaded('assessment', function () {
                return [
                    'id' => $this->assessment->id,
                    'assessment_code' => $this->assessment->assessment_code,
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
