<?php

namespace App\Http\Controllers\Assessor;

use App\Http\Controllers\Controller;
use App\Http\Requests\UploadActivityRequest;
use App\Http\Resources\ActivityLogResource;
use App\Models\Assessment;

class ActivityController extends Controller
{
    public function upload(UploadActivityRequest $request, Assessment $assessment)
    {
        $this->authorize('update', $assessment);

        return response()->json([
            'success' => true,
            'message' => 'Activity upload queued for processing',
        ], 202);
    }

    public function index(Assessment $assessment)
    {
        $this->authorize('view', $assessment);

        return ActivityLogResource::collection(
            $assessment->activityLogs()->latest('occurred_at')->paginate(50)
        );
    }
}
