<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDetectionRuleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string',
            'rule_config' => 'required|array',
            'rule_config.matcher' => 'required|in:keyword,similarity',
            'rule_config.keywords' => 'required_if:rule_config.matcher,keyword|array|min:1',
            'rule_config.keywords.*' => 'required|string|min:1',
            'rule_config.threshold' => 'required_if:rule_config.matcher,similarity|numeric|min:0|max:1',
            'severity' => 'required|in:low,medium,high,critical',
        ];
    }
}
