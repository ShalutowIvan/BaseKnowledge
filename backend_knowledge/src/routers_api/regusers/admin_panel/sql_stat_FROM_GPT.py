async def bulk_recalculate_user_stats(session: AsyncSession) -> None:
    """
    Массовый пересчёт статистики для всех пользователей.
    Один SQL-запрос, без Python-циклов.
    """

    stmt = text("""
    WITH
    -- ---------- Knowledge ----------
    knowledge_stats AS (
        SELECT
            user_id,
            COUNT(*)                          AS knowledge_count,
            COALESCE(SUM(LENGTH(content)),0) AS knowledge_total_size
        FROM knowledge
        GROUP BY user_id
    ),

    -- ---------- Images ----------
    image_stats AS (
        SELECT
            k.user_id,
            COUNT(i.id)                       AS images_count,
            COALESCE(SUM(i.file_size),0)      AS images_total_size
        FROM image i
        JOIN knowledge k ON k.id = i.knowledge_id
        GROUP BY k.user_id
    ),

    -- ---------- Projects ----------
    project_stats AS (
        SELECT
            user_id,
            COUNT(project_id) AS projects_count
        FROM project_user_association
        GROUP BY user_id
    ),

    -- ---------- Sections ----------
    section_stats AS (
        SELECT
            pua.user_id,
            COUNT(s.id) AS sections_count
        FROM section s
        JOIN project p ON p.id = s.project_id
        JOIN project_user_association pua ON pua.project_id = p.id
        GROUP BY pua.user_id
    ),

    -- ---------- Tasks ----------
    task_stats AS (
        SELECT
            pua.user_id,
            COUNT(t.id)                          AS tasks_count,
            COALESCE(SUM(LENGTH(t.content)), 0) AS tasks_total_size
        FROM task t
        JOIN section s ON s.id = t.section_id
        JOIN project p ON p.id = s.project_id
        JOIN project_user_association pua ON pua.project_id = p.id
        GROUP BY pua.user_id
    )

    UPDATE user_stats us
    SET
        -- Knowledge
        knowledge_count = COALESCE(ks.knowledge_count, 0),
        knowledge_total_size = COALESCE(ks.knowledge_total_size, 0),
        knowledge_average_text_size =
            CASE
                WHEN COALESCE(ks.knowledge_count, 0) = 0 THEN 0
                ELSE ks.knowledge_total_size / ks.knowledge_count
            END,

        -- Images
        images_count = COALESCE(is2.images_count, 0),
        images_total_size = COALESCE(is2.images_total_size, 0),
        images_average_size =
            CASE
                WHEN COALESCE(is2.images_count, 0) = 0 THEN 0
                ELSE is2.images_total_size / is2.images_count
            END,

        -- Projects / Sections
        projects_count = COALESCE(ps.projects_count, 0),
        sections_count = COALESCE(ss.sections_count, 0),

        -- Tasks
        tasks_count = COALESCE(ts.tasks_count, 0),
        tasks_total_size = COALESCE(ts.tasks_total_size, 0),
        tasks_average_size =
            CASE
                WHEN COALESCE(ts.tasks_count, 0) = 0 THEN 0
                ELSE ts.tasks_total_size / ts.tasks_count
            END,

        updated_at = TIMEZONE('utc', now())

    FROM
        knowledge_stats ks
        FULL JOIN image_stats   is2 ON is2.user_id = ks.user_id
        FULL JOIN project_stats ps  ON ps.user_id  = COALESCE(ks.user_id, is2.user_id)
        FULL JOIN section_stats ss  ON ss.user_id  = COALESCE(ks.user_id, is2.user_id)
        FULL JOIN task_stats    ts  ON ts.user_id  = COALESCE(ks.user_id, is2.user_id)

    WHERE us.user_id = COALESCE(
        ks.user_id,
        is2.user_id,
        ps.user_id,
        ss.user_id,
        ts.user_id
    );
    """)

    await session.execute(stmt)
    await session.commit()
