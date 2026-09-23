<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AssessmentSession extends Model
{
    use HasFactory;
    protected $fillable = [
        'assessment_id',
        'session_token',
        'consent_token',
        'device_id',
        'agent_token_hash',
        'agent_status',
        'status',
        'started_at',
        'expires_at',
        'ended_at',
        'connected_at',
        'last_seen_at',
        'consent_ip',
        'consent_user_agent',
        'consent_given_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => 'string',
            'agent_status' => 'string',
            'started_at' => 'datetime',
            'expires_at' => 'datetime',
            'ended_at' => 'datetime',
            'connected_at' => 'datetime',
            'last_seen_at' => 'datetime',
            'consent_given_at' => 'datetime',
        ];
    }

    public function assessment()
    {
        return $this->belongsTo(Assessment::class);
    }
}
