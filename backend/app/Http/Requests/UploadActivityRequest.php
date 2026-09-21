<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UploadActivityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'file' => 'required|file|mimes:json|max:102400',
        ];
    }
}
