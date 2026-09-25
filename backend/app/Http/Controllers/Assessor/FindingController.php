<?php

namespace App\Http\Controllers\Assessor;

use App\Http\Controllers\Controller;
use App\Http\Resources\FindingResource;
use App\Models\Assessment;
use App\Models\LogFinding;
use App\Models\VisualFinding;

class FindingController extends Controller
{
    public function all()
    {
        $userId = auth()->id();
        $search = request('search');

        $visual = VisualFinding::query()
            ->with(['rule', 'assessment'])
            ->whereHas('assessment', fn ($q) => $q->where('assessor_id', $userId));

        $log = LogFinding::query()
            ->with(['rule', 'assessment'])
            ->whereHas('assessment', fn ($q) => $q->where('assessor_id', $userId));

        if ($search) {
            $visual->where(function ($q) use ($search) {
                $q->where('type', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhereHas('assessment', fn ($a) => $a->where('employee_name', 'like', "%{$search}%"));
            });
            $log->where(function ($q) use ($search) {
                $q->where('type', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhereHas('assessment', fn ($a) => $a->where('employee_name', 'like', "%{$search}%"));
            });
        }

        $sortOrder = request('order', 'desc');
        $allVisual = $visual->latest('detected_at')->get();
        $allLog = $log->latest('detected_at')->get();
        $findings = $allVisual->concat($allLog);

        if ($sortOrder === 'asc') {
            $findings = $findings->sortBy('detected_at')->values();
        } else {
            $findings = $findings->sortByDesc('detected_at')->values();
        }

        $page = request('page', 1);
        $perPage = 20;
        $paginated = new \Illuminate\Pagination\LengthAwarePaginator(
            $findings->forPage($page, $perPage),
            $findings->count(),
            $perPage,
            $page,
            ['path' => url()->current(), 'query' => request()->query()]
        );

        return FindingResource::collection($paginated);
    }

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
