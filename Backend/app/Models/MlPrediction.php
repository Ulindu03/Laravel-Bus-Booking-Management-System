<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MlPrediction extends Model
{
    public $timestamps = false;

    protected $table = 'ml_predictions_log';

    protected $fillable = [
        'route_id',
        'segment_index',
        'prediction_date',
        'predicted_demand',
        'actual_demand',
        'model_version',
    ];

    protected function casts(): array
    {
        return [
            'prediction_date' => 'date',
            'created_at' => 'datetime',
        ];
    }

    /**
     * Get the route this prediction is for.
     */
    public function route()
    {
        return $this->belongsTo(Route::class);
    }
}
