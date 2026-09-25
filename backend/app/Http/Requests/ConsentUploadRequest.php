<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ConsentUploadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'file' => 'required|file|mimes:json,zip|max:102400',
        ];
    }
}
