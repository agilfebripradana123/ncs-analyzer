<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JudiCorpus extends Model
{
    protected $table = 'judi_corpus';

    protected $fillable = ['text', 'label'];

    protected function casts(): array
    {
        return [
            'label' => 'boolean',
        ];
    }
}
