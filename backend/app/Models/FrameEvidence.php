<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FrameEvidence extends Model
{
    use HasFactory;

    protected $fillable = [
        'assessment_id',
        'session_id',
        'device_id',
        'frame_number',
        'metadata',
        'captured_at',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
            'captured_at' => 'datetime',
        ];
    }

    public function assessment()
    {
        return $this->belongsTo(Assessment::class);
    }

    public function session()
    {
        return $this->belongsTo(AssessmentSession::class);
    }
}
