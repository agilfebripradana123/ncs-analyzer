<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index()
    {
        return UserResource::collection(User::paginate(20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'email' => 'required|email|unique:users',
            'password' => 'required|string|min:8',
            'role' => 'required|in:admin,assessor',
        ]);

        $user = User::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'User created',
            'data' => new UserResource($user),
        ], 201);
    }

    public function show(User $user)
    {
        return response()->json([
            'success' => true,
            'data' => new UserResource($user),
        ]);
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string',
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
            'password' => 'sometimes|string|min:8',
            'role' => 'sometimes|in:admin,assessor',
            'status' => 'sometimes|in:active,inactive',
        ]);

        $user->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'User updated',
            'data' => new UserResource($user),
        ]);
    }

    public function destroy(User $user)
    {
        $user->update(['status' => 'inactive']);

        return response()->json(['success' => true, 'message' => 'User deactivated']);
    }
}
