<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('email', 'serendibgo03@gmail.com')->first();
        
        if (!$admin) {
            User::create([
                'name' => 'Super Admin',
                'email' => 'serendibgo03@gmail.com',
                'password' => Hash::make('serandib1234'),
                'role' => 'super_admin'
            ]);
        } else {
            // Ensure the existing user has super_admin role and updated password
            $admin->update([
                'role' => 'super_admin',
                'password' => Hash::make('serandib1234'),
            ]);
        }
    }
}
