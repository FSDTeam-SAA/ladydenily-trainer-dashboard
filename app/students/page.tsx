"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { studentsAPI } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { UserPagination } from "@/components/user-pagination";

export default function UserPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const {
    data: usersData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["trainer-students"],
    queryFn: () => studentsAPI.getTrainerStudents(),
  });

  const students = usersData?.data?.students || [];
  const total = usersData?.data?.totalUniqueStudents ?? students.length;
  const totalPages = Math.ceil(total / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedStudents = students.slice(startIndex, startIndex + itemsPerPage);

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-card rounded-lg border border-border p-6">
          <p className="text-center text-red-500">
            Failed to load users. Please try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 pt-16">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Students</h1>
        <p className="text-sm text-muted-foreground">Dashboard &gt; students</p>
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-medium text-muted-foreground">
                  Student
                </th>
                <th className="text-left p-4 font-medium text-muted-foreground">
                  Email
                </th>
                <th className="text-left p-4 font-medium text-muted-foreground">
                  Phone
                </th>
                <th className="text-left p-4 font-medium text-muted-foreground">
                  Courses
                </th>
                <th className="text-left p-4 font-medium text-muted-foreground">
                  Total Price
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 7 }).map((_, index) => (
                    <tr
                      key={index}
                      className={
                        index % 2 === 0 ? "bg-background" : "bg-muted/20"
                      }
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-4 w-40" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-4 w-28" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-4 w-48" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-4 w-28" />
                      </td>
                    </tr>
                  ))
                : paginatedStudents.length > 0 ? paginatedStudents.map((entry, index) => (
                    <tr
                      key={entry.student._id}
                      className={
                        index % 2 === 0 ? "bg-background" : "bg-muted/20"
                      }
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              src={entry.student.avatar?.url || "/placeholder.svg"}
                              alt={entry.student.name}
                            />
                            <AvatarFallback>
                              {entry.student.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <span className="font-medium text-foreground">
                              {entry.student.name}
                            </span>
                            <p className="text-xs text-muted-foreground">
                              {entry.student.role}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {entry.student.email}
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {entry.student.phone || "N/A"}
                      </td>
                      <td className="p-4 text-muted-foreground">
                        <div>
                          <span className="font-medium text-foreground">
                            {entry.courses.map((course) => course.name).join(", ") ||
                              "No enrolled course"}
                          </span>
                          <p className="text-xs text-muted-foreground">
                            {entry.enrolledCourseCount} course(s) enrolled
                          </p>
                        </div>
                      </td>
                      <td className="p-4 text-foreground">
                        $
                        {entry.courses
                          .reduce((sum, course) => sum + (course.price || 0), 0)
                          .toFixed(2)}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-sm text-muted-foreground">
                        No students found.
                      </td>
                    </tr>
                  )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="border-t border-border p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {isLoading
                ? "Loading..."
                : `Showing ${total === 0 ? 0 : startIndex + 1} to ${Math.min(
                    currentPage * itemsPerPage,
                    total
                  )} of ${total} results`}
            </p>
            {!isLoading && totalPages > 1 && (
              <UserPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
