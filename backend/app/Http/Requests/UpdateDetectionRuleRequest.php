<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateDetectionRuleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'sometimes|string',
            'type' => 'sometimes|in:visual,log',
            'rule_config' => 'sometimes|array',
            'severity' => 'sometimes|in:low,medium,high,critical',
            'status' => 'sometimes|in:active,inactive',
        ];
    }
}
