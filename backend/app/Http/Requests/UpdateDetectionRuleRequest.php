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
            'rule_config' => 'sometimes|array',
            'rule_config.matcher' => 'sometimes|in:keyword,similarity',
            'rule_config.keywords' => 'required_if:rule_config.matcher,keyword|array|min:1',
            'rule_config.keywords.*' => 'required|string|min:1',
            'rule_config.threshold' => 'required_if:rule_config.matcher,similarity|numeric|min:0|max:1',
            'severity' => 'sometimes|in:low,medium,high,critical',
            'status' => 'sometimes|in:active,inactive',
        ];
    }
}
