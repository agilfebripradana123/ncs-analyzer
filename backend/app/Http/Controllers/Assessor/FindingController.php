<?php

namespace App\Http\Controllers\Assessor;

use App\Http\Controllers\Controller;
use App\Http\Resources\FindingResource;
use App\Models\Assessment;

class FindingController extends Controller
{
    public function index(Assessment $assessment)
    {
        $this->authorize('view', $assessment);

        $visual = $assessment->visualFindings()->with('rule')->get();
        $log = $assessment->logFindings()->with('rule')->get();
        $all = $visual->merge($log)->sortByDesc('detected_at')->values();

        return FindingResource::collection($all);
    }

    public function visual(Assessment $assessment)
    {
        $this->authorize('view', $assessment);

        return FindingResource::collection(
            $assessment->visualFindings()->with('rule')->latest('detected_at')->paginate(20)
        );
    }

    public function log(Assessment $assessment)
    {
        $this->authorize('view', $assessment);

        return FindingResource::collection(
            $assessment->logFindings()->with('rule')->latest('detected_at')->paginate(20)
        );
    }
}
