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
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
