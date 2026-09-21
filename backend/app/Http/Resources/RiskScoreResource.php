<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class RiskScoreResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'score' => $this->score,
            'level' => $this->level,
            'calculation_data' => $this->calculation_data,
            'calculated_at' => $this->calculated_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
