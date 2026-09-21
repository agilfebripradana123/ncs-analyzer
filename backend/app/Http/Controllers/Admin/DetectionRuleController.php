<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDetectionRuleRequest;
use App\Http\Requests\UpdateDetectionRuleRequest;
use App\Http\Resources\DetectionRuleResource;
use App\Models\DetectionRule;

class DetectionRuleController extends Controller
{
    public function index()
    {
        return DetectionRuleResource::collection(DetectionRule::paginate(20));
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
