<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    use HasFactory;
    protected $fillable = [
        'employee_code',
        'name',
        'department',
        'position',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'status' => 'string',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function ($employee) {
            if (!$employee->employee_code) {
                $lastCode = static::lockForUpdate()->latest('id')->value('employee_code');
                $num = $lastCode ? (int)substr($lastCode, 4) + 1 : 1;
                $employee->employee_code = sprintf('EMP-%02d', $num);
            }
        });
    }

    public function assessments()
    {
        return $this->hasMany(Assessment::class);
    }
}
