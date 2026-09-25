<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ReportResource extends JsonResource
{
    public function toArray($request): array
    {
        $summaryData = is_string($this->summary) ? json_decode($this->summary, true) : $this->summary;

        return [
            'id' => $this->id,
            'assessment_id' => $this->assessment_id,
            'summary' => $summaryData,
            'total_findings' => $this->total_findings,
            'generated_at' => $this->generated_at?->toISOString(),
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