<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DetectionRule extends Model
{
    protected $fillable = [
        'name',
        'type',
        'rule_config',
        'severity',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'type' => 'string',
            'rule_config' => 'array',
            'severity' => 'string',
            'status' => 'string',
        ];
    }

    public function visualFindings()
    {
        return $this->hasMany(VisualFinding::class, 'rule_id');
    }

    public function logFindings()
    {
        return $this->hasMany(LogFinding::class, 'rule_id');
    }
}
