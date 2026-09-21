<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class EmployeeResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'employee_code' => $this->employee_code,
            'name' => $this->name,
            'department' => $this->department,
            'position' => $this->position,
            'status' => $this->status,
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
