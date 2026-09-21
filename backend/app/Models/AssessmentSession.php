<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AssessmentSession extends Model
{
    protected $fillable = [
        'assessment_id',
        'session_token',
        'status',
        'started_at',
        'expires_at',
        'ended_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => 'string',
            'started_at' => 'datetime',
            'expires_at' => 'datetime',
            'ended_at' => 'datetime',
        ];
    }

    public function assessment()
    {
        return $this->belongsTo(Assessment::class);
    }
}
