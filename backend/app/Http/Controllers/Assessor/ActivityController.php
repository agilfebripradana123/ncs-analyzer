<?php

namespace App\Http\Controllers\Assessor;

use App\Http\Controllers\Controller;
use App\Http\Requests\UploadActivityRequest;
use App\Http\Resources\ActivityLogResource;
use App\Jobs\ProcessActivityLog;
use App\Models\Assessment;

class ActivityController extends Controller
{
    public function upload(UploadActivityRequest $request, Assessment $assessment)
    {
        $this->authorize('update', $assessment);

        $entries = json_decode($request->file('file')->getContent(), true) ?? [];

        if (empty($entries)) {
            return response()->json(['success' => false, 'message' => 'Empty activity file'], 422);
        }

        ProcessActivityLog::dispatchSync($assessment, $entries);

        return response()->json([
            'success' => true,
            'message' => 'Activity upload processed',
            'data' => ['entries_count' => count($entries)],
        ]);
    }

    public function index(Assessment $assessment)
    {
        $this->authorize('view', $assessment);

        return ActivityLogResource::collection(
            $assessment->activityLogs()->latest('occurred_at')->paginate(50)
        );
    }
}
