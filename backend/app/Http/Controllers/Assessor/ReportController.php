<?php

namespace App\Http\Controllers\Assessor;

use App\Http\Controllers\Controller;
use App\Http\Resources\ReportResource;
use App\Models\Assessment;
use App\Models\Report;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        $userId = auth()->id();
        $search = $request->input('search');

        $query = Report::with(['assessment.employee'])
            ->whereNotNull('generated_at')
            ->whereHas('assessment', fn ($q) => $q->where('assessor_id', $userId));

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('summary', 'like', "%{$search}%")
                  ->orWhereHas('assessment', function ($a) use ($search) {
                      $a->where('assessment_code', 'like', "%{$search}%")
                        ->orWhereHas('employee', fn ($e) => $e->where('name', 'like', "%{$search}%"));
                  });
            });
        }

        $sortBy = $request->input('sort', 'generated_at');
        $sortOrder = $request->input('order', 'desc');
        $allowedSort = ['summary', 'total_findings', 'generated_at', 'created_at'];
        if (in_array($sortBy, $allowedSort)) {
            $query->orderBy($sortBy, $sortOrder);
        } else {
            $query->latest('generated_at');
        }

        return ReportResource::collection($query->paginate(20));
    }

    public function generate(Assessment $assessment)
    {
        $this->authorize('update', $assessment);

        return response()->json([
            'success' => true,
            'message' => 'Report generation queued',
        ], 202);
    }

    public function show(Assessment $assessment)
    {
        $this->authorize('view', $assessment);

        $report = $assessment->report;

        if (!$report) {
            return response()->json(['success' => false, 'message' => 'Report not generated'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => new ReportResource($report),
        ]);
    }
}
