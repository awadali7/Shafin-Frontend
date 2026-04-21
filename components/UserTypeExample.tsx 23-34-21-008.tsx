/**
 * Example component showing how to use User Type utilities
 * This is a reference component - use these patterns in your actual components
 */

"use client";

import { useAuth } from "@/contexts/AuthContext";
import {
    getUserType,
    getUserTypeLabel,
    getUserTypeFlags,
    canAccessCourses,
    canAccessWholesale,
    canAccessAdmin,
    getKYCStatusMessage,
    getAvailableFeatures,
} from "@/lib/utils/userType";

export default function UserTypeExample() {
    const { user } = useAuth();

    // Get user type flags
    const flags = getUserTypeFlags(user);
    const userType = getUserType(user);
    const userTypeLabel = getUserTypeLabel(userType);
    const kycMessage = getKYCStatusMessage(user);
    const features = getAvailableFeatures(user);

    return (
        <div className="p-6 bg-white rounded-lg shadow-lg max-w-2xl">
            <h2 className="text-2xl font-bold mb-4">User Type Information</h2>

            {/* User Type */}
            <div className="mb-4">
                <h3 className="font-semibold text-lg mb-2">Current User Type</h3>
                <p className="text-xl text-[#B00000] font-bold">{userTypeLabel}</p>
            </div>

            {/* User Flags */}
            <div className="mb-4">
                <h3 className="font-semibold text-lg mb-2">User Flags</h3>
                <div className="grid grid-cols-2 gap-2">
                    <div className={`p-2 rounded ${flags.isGuest ? 'bg-red-100' : 'bg-gray-100'}`}>
                        Guest: {flags.isGuest ? '✓' : '✗'}
                    </div>
                    <div className={`p-2 rounded ${flags.isAuthenticated ? 'bg-green-100' : 'bg-gray-100'}`}>
                        Authenticated: {flags.isAuthenticated ? '✓' : '✗'}
                    </div>
                    <div className={`p-2 rounded ${flags.isStudent ? 'bg-green-100' : 'bg-gray-100'}`}>
                        Student: {flags.isStudent ? '✓' : '✗'}
                    </div>
                    <div className={`p-2 rounded ${flags.isBusinessOwner ? 'bg-green-100' : 'bg-gray-100'}`}>
                        Business Owner: {flags.isBusinessOwner ? '✓' : '✗'}
                    </div>
                    <div className={`p-2 rounded ${flags.isAdmin ? 'bg-green-100' : 'bg-gray-100'}`}>
                        Admin: {flags.isAdmin ? '✓' : '✗'}
                    </div>
                    <div className={`p-2 rounded ${flags.hasAnyKYC ? 'bg-green-100' : 'bg-gray-100'}`}>
                        Has KYC: {flags.hasAnyKYC ? '✓' : '✗'}
                    </div>
                </div>
            </div>

            {/* Permissions */}
            <div className="mb-4">
                <h3 className="font-semibold text-lg mb-2">Permissions</h3>
                <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span>Can Access Courses</span>
                        <span className={canAccessCourses(user) ? 'text-green-600' : 'text-red-600'}>
                            {canAccessCourses(user) ? '✓ Yes' : '✗ No'}
                        </span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span>Can Access Wholesale</span>
                        <span className={canAccessWholesale(user) ? 'text-green-600' : 'text-red-600'}>
                            {canAccessWholesale(user) ? '✓ Yes' : '✗ No'}
                        </span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span>Can Access Admin Panel</span>
                        <span className={canAccessAdmin(user) ? 'text-green-600' : 'text-red-600'}>
                            {canAccessAdmin(user) ? '✓ Yes' : '✗ No'}
                        </span>
                    </div>
                </div>
            </div>

            {/* KYC Status Message */}
            {kycMessage && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <h3 className="font-semibold text-sm mb-1">KYC Status</h3>
                    <p className="text-sm text-yellow-800">{kycMessage}</p>
                </div>
            )}

            {/* Available Features */}
            <div className="mb-4">
                <h3 className="font-semibold text-lg mb-2">Available Features</h3>
                <ul className="list-disc list-inside space-y-1">
                    {features.map((feature, index) => (
                        <li key={index} className="text-sm text-gray-700">{feature}</li>
                    ))}
                </ul>
            </div>

            {/* Quick Actions */}
            <div className="mb-4">
                <h3 className="font-semibold text-lg mb-2">Quick Actions</h3>
                <div className="flex flex-wrap gap-2">
                    {flags.isGuest && (
                        <button className="px-4 py-2 bg-[#B00000] text-white rounded hover:bg-red-800">
                            Login
                        </button>
                    )}
                    {flags.isAuthenticated && flags.needsKYC && (
                        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                            Complete KYC
                        </button>
                    )}
                    {flags.isAuthenticated && flags.needsProductKYC && (
                        <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                            Complete Product KYC
                        </button>
                    )}
                    {flags.isStudent && (
                        <button className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
                            My Courses
                        </button>
                    )}
                    {flags.isBusinessOwner && (
                        <button className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700">
                            Shop Products
                        </button>
                    )}
                    {flags.isAdmin && (
                        <button className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900">
                            Admin Panel
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ========================================
// Usage Examples in Different Scenarios
// ========================================

/**
 * Example 1: Conditional Rendering Based on User Type
 */
export function ConditionalContentExample() {
    const { user } = useAuth();
    const { isGuest, isStudent, isBusinessOwner, isAdmin } = getUserTypeFlags(user);

    return (
        <div>
            {isGuest && <div>Please login to access more features</div>}
            {isStudent && <div>Welcome Student! Check out your courses.</div>}
            {isBusinessOwner && <div>Welcome Business Owner! Browse our products.</div>}
            {isAdmin && <div>Welcome Admin! Manage the platform.</div>}
        </div>
    );
}

/**
 * Example 2: Protect Routes/Pages
 */
export function ProtectedPageExample() {
    const { user } = useAuth();
    
    if (!canAccessCourses(user)) {
        return (
            <div className="p-6 text-center">
                <h2 className="text-xl font-bold mb-4">Access Denied</h2>
                <p>You need to complete KYC verification to access courses.</p>
                <button className="mt-4 px-6 py-2 bg-[#B00000] text-white rounded">
                    Complete KYC
                </button>
            </div>
        );
    }

    return <div>Course content here...</div>;
}

/**
 * Example 3: Dynamic Navigation Based on User Type
 */
export function DynamicNavigationExample() {
    const { user } = useAuth();
    const { isStudent, isBusinessOwner, isAdmin } = getUserTypeFlags(user);

    return (
        <nav className="flex gap-4">
            <a href="/">Home</a>
            {isStudent && <a href="/my-learning">My Courses</a>}
            {isBusinessOwner && <a href="/shop">Shop</a>}
            {isBusinessOwner && <a href="/orders">My Orders</a>}
            {isAdmin && <a href="/admin">Admin Panel</a>}
        </nav>
    );
}

/**
 * Example 4: Show Different Pricing Based on User Type
 */
export function PricingDisplayExample({ regularPrice }: { regularPrice: number }) {
    const { user } = useAuth();
    const flags = getUserTypeFlags(user);

    return (
        <div className="p-4 border rounded">
            <div className="text-2xl font-bold">
                {flags.isBusinessOwner ? (
                    <>
                        <span className="line-through text-gray-400">₹{regularPrice}</span>
                        <span className="ml-2 text-green-600">₹{regularPrice * 0.8}</span>
                        <span className="text-sm ml-2 bg-green-100 px-2 py-1 rounded">20% OFF</span>
                    </>
                ) : (
                    <span>₹{regularPrice}</span>
                )}
            </div>
            {!flags.isBusinessOwner && flags.isAuthenticated && (
                <p className="text-sm text-gray-600 mt-2">
                    Complete Product KYC to get business pricing!
                </p>
            )}
        </div>
    );
}

