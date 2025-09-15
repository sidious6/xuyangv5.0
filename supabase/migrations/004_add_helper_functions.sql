-- 创建获取公共表列表的函数
CREATE OR REPLACE FUNCTION get_public_tables()
RETURNS TABLE(table_name TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT t.tablename::TEXT
  FROM pg_tables t
  WHERE t.schemaname = 'public'
  ORDER BY t.tablename;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建获取表详细信息的函数
CREATE OR REPLACE FUNCTION get_table_info(table_name_param TEXT)
RETURNS TABLE(
  column_name TEXT,
  data_type TEXT,
  is_nullable TEXT,
  column_default TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.column_name::TEXT,
    c.data_type::TEXT,
    c.is_nullable::TEXT,
    c.column_default::TEXT
  FROM information_schema.columns c
  WHERE c.table_schema = 'public' 
    AND c.table_name = table_name_param
  ORDER BY c.ordinal_position;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建删除表的安全函数
CREATE OR REPLACE FUNCTION drop_table_safe(table_name_param TEXT)
RETURNS TEXT AS $$
DECLARE
  result TEXT;
BEGIN
  -- 检查表是否存在
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = table_name_param
  ) THEN
    RETURN '表 ' || table_name_param || ' 不存在';
  END IF;
  
  -- 执行删除
  EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(table_name_param) || ' CASCADE';
  
  RETURN '表 ' || table_name_param || ' 已成功删除';
EXCEPTION
  WHEN OTHERS THEN
    RETURN '删除表 ' || table_name_param || ' 时发生错误: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;