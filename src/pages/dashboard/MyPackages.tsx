import React, { useState, useEffect } from 'react';
import {
  Package,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  Award,
  Loader2,
  Shield,
  Lock,
  Unlock,
  Play
} from 'lucide-react';
import { formatCurrency, cn } from '../../lib/utils';
import { Link, useNavigate } from 'react-router-dom';
import { fetchApi } from '../../lib/api';
import { useAuth } from '../../App';
import { optimizeCloudinaryUrl } from '../../lib/imageUtils';

import LoadingScreen from '../../components/LoadingScreen';
import CustomCheckoutModal from '../../components/CustomCheckoutModal';

const parseCourseIds = (coursesField: any): string[] => {
  if (!coursesField) return [];
  if (Array.isArray(coursesField)) {
    return coursesField.map((c) => String(c).trim()).filter(Boolean);
  }
  if (typeof coursesField === 'string') {
    const trimmed = coursesField.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed) ? parsed.map((c) => String(c).trim()).filter(Boolean) : [];
      } catch {}
    }
    return trimmed
      .replace(/^[\[\{]+|[\]\}]+$/g, '')
      .replace(/"/g, '')
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);
  }
  return [];
};

const MyPackages = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userData, setUserData] = useState<any>(null);
  const [myPackages, setMyPackages] = useState<any[]>([]);
  const [availablePackages, setAvailablePackages] = useState<any[]>([]);
  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [activeOrder, setActiveOrder] = useState<{
    id: string;
    amount: number;
    packageId: string;
    packageName: string;
  } | null>(null);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [packagesRes, profileRes, enrollmentsRes, coursesRes] = await Promise.all([
        fetchApi('/packages'),
        fetchApi(`/profile/${user.id}`),
        fetchApi(`/enrollments/${user.id}`),
        fetchApi('/courses')
      ]);

      if (!packagesRes.ok) throw new Error('Failed to fetch packages');
      const packagesJson = await packagesRes.json();
      const allPackages = Array.isArray(packagesJson)
        ? packagesJson
        : packagesJson?.packages || packagesJson?.data || packagesJson?.raw || [];

      const coursesJson = coursesRes.ok ? await coursesRes.json() : [];
      const rawCourses = Array.isArray(coursesJson)
        ? coursesJson
        : coursesJson?.courses || coursesJson?.data || [];
      setAllCourses(rawCourses.filter((c: any) => c.is_active !== false));

      const profile = profileRes.ok ? await profileRes.json() : null;
      const enrollments = enrollmentsRes.ok ? await enrollmentsRes.json() : [];

      setUserData(profile);

      const ownedPkgKeys = new Set<string>();
      const addKey = (val: any) => {
        const str = String(val || '').trim().toLowerCase();
        if (str && str !== 'null' && str !== 'undefined' && str !== 'none') {
          ownedPkgKeys.add(str);
        }
      };

      if (profile?.package_id) addKey(profile.package_id);
      (enrollments || []).forEach((e: any) => {
        if (!e.status || e.status === 'active' || e.status === 'completed') {
          addKey(e.package_id);
        }
      });

      const owned = (allPackages || []).filter((p: any) => {
        const idKey = String(p.id || '').trim().toLowerCase();
        const nameKey = String(p.name || '').trim().toLowerCase();
        return (idKey && ownedPkgKeys.has(idKey)) || (nameKey && ownedPkgKeys.has(nameKey));
      });

      const ownedIds = new Set(owned.map((p: any) => String(p.id)));
      const available = (allPackages || []).filter((p: any) => !ownedIds.has(String(p.id)));

      setMyPackages(owned);
      setAvailablePackages(available);
      setError(null);
    } catch (err: any) {
      console.error('[MyPackages] Error fetching data:', err);
      setError(err.message || 'Failed to connect to backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleUpgrade = async (pkg: any) => {
    if (!user) return;
    setEnrollingId(String(pkg.id));
    try {
      const pkgAmount = Number(pkg.offer_price || pkg.price || 599);
      const res = await fetchApi('/payment/create-order', {
        method: 'POST',
        body: JSON.stringify({
          package_id: pkg.id,
          amount: pkgAmount,
          user_id: user.id
        })
      });
      if (!res.ok) throw new Error('Failed to create order');
      const orderData = await res.json();
      setActiveOrder({
        id: orderData.id,
        amount: pkgAmount || Math.round((orderData.amount || 59900) / 100),
        packageId: String(pkg.id),
        packageName: pkg.name || 'VIP Package'
      });
    } catch (err) {
      console.error('[MyPackages] Order error:', err);
    } finally {
      setEnrollingId(null);
    }
  };

  const handlePaymentSuccess = async (paymentResponse: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => {
    const pkgId = activeOrder?.packageId;
    setActiveOrder(null);
    try {
      await fetchApi('/payment/verify', {
        method: 'POST',
        body: JSON.stringify({
          order_id: paymentResponse.razorpay_order_id,
          payment_id: paymentResponse.razorpay_payment_id,
          signature: paymentResponse.razorpay_signature,
          package_id: pkgId,
          user_id: user?.id
        })
      });
      await fetchData();
    } catch (err) {
      console.error('[MyPackages] Verify error:', err);
    }
  };

  if (loading) return <LoadingScreen fullScreen={false} />;

  // Collect all course keys unlocked across the user's owned packages
  const allOwnedCourseKeys = new Set<string>();
  myPackages.forEach((pkg) => {
    parseCourseIds(pkg.courses).forEach((cid) => allOwnedCourseKeys.add(cid.toLowerCase()));
  });

  const isCourseInPackage = (course: any, pkg: any) => {
    const pkgCourseKeys = new Set(parseCourseIds(pkg.courses).map((c) => c.toLowerCase()));
    const cid = String(course.id || '').trim().toLowerCase();
    const ctitle = String(course.title || '').trim().toLowerCase();
    const cpkg = String(course.package_id || '').trim().toLowerCase();
    const pkgId = String(pkg.id || '').trim().toLowerCase();
    const pkgName = String(pkg.name || '').trim().toLowerCase();
    return (
      (cid && pkgCourseKeys.has(cid)) ||
      (ctitle && pkgCourseKeys.has(ctitle)) ||
      (cpkg && (cpkg === pkgId || cpkg === pkgName))
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Classic Page Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
            <Package size={14} className="text-slate-700" />
            <span>Package & Course Access</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">My Packages</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Courses included in your package show <strong className="text-emerald-700">Unlocked</strong>; courses not in your package show a <strong className="text-amber-700">Lock</strong> icon.
          </p>
        </div>

        <Link
          to="/dashboard/courses"
          className="px-4 py-2.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2 self-start sm:self-auto transition-colors"
        >
          <BookOpen size={14} />
          <span>Go to My Courses</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg flex items-start gap-3 text-red-800">
          <Shield className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold uppercase tracking-wider">Connection Issue Detected</p>
            <p className="text-xs mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Active / Unlocked Packages */}
      {myPackages.length > 0 ? (
        <div className="space-y-6">
          {myPackages.map((pkg) => {
            const includedCourses = allCourses.filter((c) => isCourseInPackage(c, pkg));
            const lockedCourses = allCourses.filter((c) => !isCourseInPackage(c, pkg));

            return (
              <div
                key={pkg.id}
                className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden"
              >
                {/* Package Top Banner */}
                <div className="p-5 sm:p-6 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800">
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0">
                      <Unlock size={22} />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1">
                          <Unlock size={10} />
                          <span>Unlocked • Active Package</span>
                        </span>
                        <span className="px-2.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-bold uppercase tracking-wider">
                          {includedCourses.length} Unlocked / {lockedCourses.length} Locked
                        </span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-white uppercase tracking-tight">
                        {pkg.name}
                      </h3>
                      {pkg.description && (
                        <p className="text-xs text-slate-300 mt-1 max-w-2xl">{pkg.description}</p>
                      )}
                    </div>
                  </div>

                  <Link
                    to="/dashboard/courses"
                    className="px-4 py-2.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider inline-flex items-center justify-center gap-2 shrink-0 transition-colors"
                  >
                    <Play size={13} className="fill-current" />
                    <span>Open My Courses</span>
                  </Link>
                </div>

                {/* Courses Inside vs Outside This Package */}
                <div className="p-5 sm:p-6 space-y-5">
                  {/* Unlocked Courses in Package */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Unlock size={14} className="text-emerald-600" />
                        <span>Included in My Package — Unlocked ({includedCourses.length})</span>
                      </h4>
                    </div>

                    {includedCourses.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {includedCourses.map((course: any) => (
                          <div
                            key={course.id}
                            onClick={() => navigate(`/dashboard/courses/${course.id}`)}
                            className="p-3 rounded-md bg-emerald-50/70 border border-emerald-200 hover:border-emerald-400 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded bg-emerald-600 text-white flex items-center justify-center shrink-0">
                                <Unlock size={14} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-900 uppercase truncate">
                                  {course.title}
                                </p>
                                <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                                  Unlocked • Click to Play
                                </p>
                              </div>
                            </div>
                            <Play size={14} className="text-emerald-700 shrink-0 fill-current" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">
                        No courses are linked to this package yet.
                      </p>
                    )}
                  </div>

                  {/* Locked Courses NOT in Package */}
                  {lockedCourses.length > 0 && (
                    <div className="pt-4 border-t border-slate-200">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                          <Lock size={14} className="text-amber-600" />
                          <span>Not Included in My Package — Locked ({lockedCourses.length})</span>
                        </h4>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {lockedCourses.map((course: any) => (
                          <div
                            key={course.id}
                            className="p-3 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 opacity-90"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded bg-amber-100 border border-amber-300 text-amber-700 flex items-center justify-center shrink-0">
                                <Lock size={14} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-700 uppercase truncate">
                                  {course.title}
                                </p>
                                <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                                  Locked • Not in Package
                                </p>
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold uppercase tracking-wider shrink-0 inline-flex items-center gap-1">
                              <Lock size={10} />
                              <span>Locked</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white p-10 rounded-lg border border-slate-200 text-center space-y-3 shadow-sm">
          <div className="w-12 h-12 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-center mx-auto text-amber-600">
            <Lock size={22} />
          </div>
          <h3 className="text-base font-bold text-slate-900 uppercase tracking-tight">
            No Active Package Unlocked
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            You haven't unlocked a package yet. Choose a package below to unlock courses.
          </p>
        </div>
      )}

      {/* Locked / Upgrade Packages */}
      {availablePackages.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <Lock size={15} className="text-amber-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Other Packages (Locked — Upgrade to Unlock)
              </h3>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              {availablePackages.length} Locked Package{availablePackages.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availablePackages.map((pkg) => {
              const pkgCourses = allCourses.filter((c) => isCourseInPackage(c, pkg));

              return (
                <div
                  key={pkg.id}
                  className="bg-white rounded-lg border border-slate-200 shadow-sm hover:border-slate-300 transition-all overflow-hidden flex flex-col"
                >
                  <div className="aspect-video relative overflow-hidden bg-slate-100 border-b border-slate-200">
                    <img
                      src={optimizeCloudinaryUrl(
                        pkg.thumbnail_url ||
                          'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=800&auto=format&fit=crop',
                        640,
                        360
                      )}
                      alt={pkg.name}
                      className="w-full h-full object-cover brightness-90"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=800&auto=format&fit=crop';
                      }}
                    />
                    <div className="absolute top-2.5 left-2.5">
                      <span className="px-2.5 py-1 rounded bg-amber-600 text-white text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 shadow-sm">
                        <Lock size={11} />
                        <span>Locked Package</span>
                      </span>
                    </div>
                    <div className="absolute top-2.5 right-2.5 bg-slate-900/95 px-3 py-1 rounded text-xs font-bold text-white shadow-sm">
                      {formatCurrency(pkg.offer_price || pkg.price)}
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-base text-slate-900 uppercase tracking-tight">
                          {pkg.name}
                        </h4>
                        <Lock size={15} className="text-amber-600 shrink-0 mt-0.5" />
                      </div>
                      {pkg.description && (
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                          {pkg.description}
                        </p>
                      )}

                      {pkgCourses.length > 0 && (
                        <div className="mt-3 p-2.5 rounded bg-slate-50 border border-slate-200 space-y-1.5">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            Unlocks {pkgCourses.length} Course{pkgCourses.length > 1 ? 's' : ''}:
                          </p>
                          <div className="space-y-1 max-h-24 overflow-y-auto">
                            {pkgCourses.map((c: any) => (
                              <div
                                key={c.id}
                                className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700"
                              >
                                <Lock size={11} className="text-amber-600 shrink-0" />
                                <span className="truncate">{c.title}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleUpgrade(pkg)}
                      disabled={enrollingId === String(pkg.id)}
                      className="w-full py-2.5 px-4 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {enrollingId === String(pkg.id) ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <>
                          <Unlock size={14} />
                          <span>Unlock Package ({formatCurrency(pkg.offer_price || pkg.price)})</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <CustomCheckoutModal
        isOpen={Boolean(activeOrder)}
        onClose={() => setActiveOrder(null)}
        amount={activeOrder?.amount || 599}
        orderId={activeOrder?.id || ''}
        packageName={activeOrder?.packageName || 'VIP Package'}
        customerName={userData?.full_name || user?.full_name || ''}
        customerEmail={user?.email || ''}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
};

export default MyPackages;
