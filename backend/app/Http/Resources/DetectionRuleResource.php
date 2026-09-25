<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class DetectionRuleResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'rule_config' => $this->rule_config,
            'severity' => $this->severity,
            'status' => $this->status,
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
