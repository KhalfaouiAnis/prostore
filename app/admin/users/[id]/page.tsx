import UpdateUserForm from "@/app/admin/users/[id]/update-user-form";
import { getUserById } from "@/lib/actions/user.actions";
import { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
    title: 'Update User'
}

const AdminUsertUpdatePage = async (props: { params: Promise<{ id: string }> }) => {
    const { id } = await props.params;

    const user = await getUserById(id);

    if (!user) return notFound();

    return (<div className="space-y-8 max-w-lg mx-auto">
        <h1 className="h2-bold">Update user</h1>
        <UpdateUserForm user={user} />
    </div>);
}

export default AdminUsertUpdatePage;