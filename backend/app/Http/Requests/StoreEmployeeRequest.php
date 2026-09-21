<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreEmployeeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'employee_code' => 'required|string|unique:employees',
            'name' => 'required|string',
            'department' => 'nullable|string',
            'position' => 'nullable|string',
        ];
    }
}
