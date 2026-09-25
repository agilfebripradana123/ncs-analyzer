<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreAssessmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'employee_name' => 'required|string|max:150',
            'employee_department' => 'nullable|string|max:150',
            'description' => 'nullable|string|max:5000',
        ];
    }
}