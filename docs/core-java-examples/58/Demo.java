import java.io.*;
import java.nio.file.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.function.*;
import java.util.regex.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.sql.*;

public class Demo {
    public static void main(String[] args) throws Exception {
        String sql = "SELECT name FROM students WHERE id = ?";
        System.out.println(sql);
        // With a configured Connection connection:
        // try (PreparedStatement stmt = connection.prepareStatement(sql)) {
        //     stmt.setInt(1, 101);
        //     try (ResultSet rows = stmt.executeQuery()) {
        //         while (rows.next()) System.out.println(rows.getString("name"));
        //     }
        // }
    }
}
