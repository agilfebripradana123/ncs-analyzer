<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ActivityLog extends Model
{
    protected $fillable = [
        'assessment_id',
        'activity_type',
        'activity_data',
        'occurred_at',
    ];

    protected function casts(): array
    {
        return [
            'activity_data' => 'array',
            'occurred_at' => 'datetime',
        ];
    }

    public function assessment()
    {
        return $this->belongsTo(Assessment::class);
    }
}
