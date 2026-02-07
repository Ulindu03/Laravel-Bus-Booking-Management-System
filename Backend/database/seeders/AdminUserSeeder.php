<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User; //we cant direct communicate with db so we use models to connect with db
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@themidev.com'],
            [
                'name' => 'ulindu',
                'password' => Hash::make('ulindu2003'),
                'role' => 'admin',
            ]
        );
    }
}

