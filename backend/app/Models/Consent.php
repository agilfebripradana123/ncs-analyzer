<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Consent extends Model
{
    protected $fillable = [
        'assessment_id',
        'status',
        'consent_text',
        'consented_at',
        'ip_address',
    ];

    protected function casts(): array
    {
        return [
            'status' => 'string',
            'consented_at' => 'datetime',
        ];
    }

    public function assessment()
    {
        return $this->belongsTo(Assessment::class);
    }
}
