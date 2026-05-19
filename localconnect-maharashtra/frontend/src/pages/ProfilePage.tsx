import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { formatLocationPath } from '@/lib/utils';

export default function ProfilePage() {
  const { userId } = useParams();
  const currentUser = useAuthStore((s) => s.user);
  const id = userId || currentUser?.id;

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', id],
    queryFn: async () => {
      const { data } = await api.get(userId ? `/users/${userId}` : '/auth/me');
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) return <div className="card h-48 animate-pulse max-w-2xl mx-auto" />;
  if (!profile) return <p>User not found</p>;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card p-8 text-center space-y-4">
        <div className="h-24 w-24 rounded-full bg-brand-100 mx-auto flex items-center justify-center text-3xl font-bold text-brand-700">
          {profile.firstName[0]}{profile.lastName[0]}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{profile.firstName} {profile.lastName}</h1>
          {profile.bio && <p className="text-[hsl(var(--muted-foreground))] mt-2">{profile.bio}</p>}
          {profile.location && (
            <p className="text-sm text-brand-600 mt-2">{formatLocationPath(profile.location)}</p>
          )}
        </div>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          {profile._count?.posts ?? 0} posts · Member since {new Date(profile.createdAt).getFullYear()}
        </p>
      </div>
    </div>
  );
}
