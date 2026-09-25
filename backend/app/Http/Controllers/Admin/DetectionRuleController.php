<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDetectionRuleRequest;
use App\Http\Requests\UpdateDetectionRuleRequest;
use App\Http\Resources\DetectionRuleResource;
use App\Models\DetectionRule;
use Illuminate\Http\Request;

class DetectionRuleController extends Controller
{
    public function index(Request $request)
    {
        $query = DetectionRule::query();

        if ($search = $request->input('search')) {
            $query->where('name', 'like', "%{$search}%");
        }

        $sortBy = $request->input('sort', 'created_at');
        $sortOrder = $request->input('order', 'desc');
        $allowedSort = ['name', 'severity', 'status', 'created_at'];
        if (in_array($sortBy, $allowedSort)) {
            $query->orderBy($sortBy, $sortOrder);
        }

        return DetectionRuleResource::collection($query->paginate(20));
    }

    public function store(StoreDetectionRuleRequest $request)
    {
        $rule = DetectionRule::create($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Detection rule created',
            'data' => new DetectionRuleResource($rule),
        ], 201);
    }

    public function show(DetectionRule $rule)
    {
        return response()->json([
            'success' => true,
            'data' => new DetectionRuleResource($rule),
        ]);
    }

    public function update(UpdateDetectionRuleRequest $request, DetectionRule $rule)
    {
        $rule->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Detection rule updated',
            'data' => new DetectionRuleResource($rule),
        ]);
    }

    public function destroy(DetectionRule $rule)
    {
        $rule->update(['status' => 'inactive']);

        return response()->json(['success' => true, 'message' => 'Detection rule deactivated']);
    }
}
