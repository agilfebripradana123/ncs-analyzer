<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateEmployeeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'sometimes|string',
            'department' => 'nullable|string',
            'position' => 'nullable|string',
            'status' => 'sometimes|in:active,inactive',
        ];
    }
}
