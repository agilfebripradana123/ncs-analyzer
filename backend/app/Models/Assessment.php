<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Assessment extends Model
{
    protected $fillable = [
        'employee_id',
        'assessor_id',
        'title',
        'assessment_code',
        'status',
        'started_at',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => 'string',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function assessor()
    {
        return $this->belongsTo(User::class, 'assessor_id');
    }

    public function consent()
    {
        return $this->hasOne(Consent::class);
    }

    public function session()
    {
        return $this->hasOne(AssessmentSession::class);
    }

    public function activityLogs()
    {
        return $this->hasMany(ActivityLog::class);
    }

    public function visualFindings()
    {
        return $this->hasMany(VisualFinding::class);
    }

    public function logFindings()
    {
        return $this->hasMany(LogFinding::class);
    }

    public function riskScore()
    {
        return $this->hasOne(RiskScore::class);
    }

    public function report()
    {
        return $this->hasOne(Report::class);
    }
}
