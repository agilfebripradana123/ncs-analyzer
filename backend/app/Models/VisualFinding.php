<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VisualFinding extends Model
{
    protected $fillable = [
        'assessment_id',
        'rule_id',
        'type',
        'description',
        'evidence',
        'severity',
        'detected_at',
    ];

    protected function casts(): array
    {
        return [
            'evidence' => 'array',
            'severity' => 'string',
            'detected_at' => 'datetime',
        ];
    }

    public function assessment()
    {
        return $this->belongsTo(Assessment::class);
    }

    public function rule()
    {
        return $this->belongsTo(DetectionRule::class, 'rule_id');
    }
}
